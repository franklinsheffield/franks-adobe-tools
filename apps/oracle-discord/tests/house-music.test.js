// House music (Frank 2026-11-27): 25 records per House from the brand map, an opening song per House, record crates
// paid in any House's tokens, and hidden cross-brand records found three ways (find, task, wrong currency).
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { HOUSE_TRACKS, OPENER, HIDDEN, TOKEN_EMOJI, HOUSE_NAMES, crateOf, musicEvent, buyRecord, resetMusicEvents, grantRecord } from "../activity/src/hosts/house-music.js";
import { RECORDS } from "../activity/src/hosts/house-records.gen.js";
import { parse, records } from "../activity/records.mjs";
import { TRACKS, ALL_TRACKS, trackOf, hasTrack, checkUnlocks, openerOf } from "../activity/src/music.js";
import { HOSTS } from "../activity/src/hosts/index.js";
import { walletOf, addTokens } from "../activity/src/hosts/tokens.js";
import { createPlayer, recordPlayerHtml, crateHtml } from "../activity/src/player.js";
import { fresh } from "../activity/src/game.js";

const esc = (s) => String(s);
const music = (f) => new URL(`../activity/music/${f}`, import.meta.url);

test("the records list is built from the brand map, and every listed record has its audio", () => {
  const rows = parse(readFileSync(music("house-records.tsv"), "utf8"));
  assert.deepEqual(RECORDS, records(rows, (id) => existsSync(music(`${id}.mp3`))), "run node activity/records.mjs after changing the TSV or the audio");
  for (const r of RECORDS) if (!r.live) assert.ok(existsSync(music(`${r.id}.mp3`)), r.id);
  for (const r of RECORDS.filter((x) => x.live)) assert.ok(TRACKS.some((t) => t.id === r.id), r.id + " is one of the Chamber's 16");
  assert.equal(new Set(RECORDS.map((r) => r.id)).size, RECORDS.length, "unique ids");
  for (const h of new Set(RECORDS.map((r) => r.house))) assert.ok(RECORDS.filter((r) => r.house === h).length <= 25, h + " has at most 25");
});

test("each House has one opening song, and it plays first when the app opens there", () => {
  for (const h of ["oracle", "alchemist", "observatory", "parlour", "scriptorium", "pixelscape"]) {
    const rows = RECORDS.filter((r) => r.house === h && r.opener); assert.ok(rows.length <= 1, h);
    if (rows.length) { assert.equal(OPENER[h], rows[0].id); assert.ok(openerOf(h), h); }
  }
  assert.equal(OPENER.alchemist, "bubble-and-brass"); assert.equal(OPENER.parlour, "knock-once-for-yes");
  // the player starts on the opener even if you don't own it, then goes on to your playlist
  const played = [];
  globalThis.Audio = class { constructor() { this.paused = true; this.volume = 1; this.l = {}; } set src(v) { this._s = v; played.push(v); } get src() { return this._s; } play() { this.paused = false; return Promise.resolve(); } pause() { this.paused = true; } addEventListener(k, f) { (this.l[k] ||= []).push(f); } };
  const p = fresh(), pl = createPlayer({ getProg: () => p, save: () => {} });
  pl.start("bubble-and-brass"); assert.equal(pl.current.id, "bubble-and-brass"); assert.equal(pl.opening, "bubble-and-brass");
  pl.refresh(); assert.equal(pl.current.id, "bubble-and-brass", "a new record unlocking doesn't cut the opener");
  pl.next(1); assert.equal(pl.current.id, "ember-menu", "then your playlist"); assert.equal(pl.opening, null);
});

test("hidden records: Parlour and Scriptorium only, each with a riddle, found by find, task or wrong currency", () => {
  const hid = HOUSE_TRACKS.filter((t) => t.hidden);
  for (const t of hid) { assert.ok(HIDDEN[t.id], t.id + " has a rule"); assert.ok(t.hint && t.hint.length > 20, t.id); assert.ok(["parlour", "scriptorium"].includes(t.house), t.id); }
  for (const r of RECORDS.filter((x) => x.role === "hidden")) assert.ok(HIDDEN[r.id] || !existsSync(music(`${r.id}.mp3`)), r.id + " needs a HIDDEN rule");
  for (const [id, h] of Object.entries(HIDDEN)) { assert.ok(["find", "task", "wrong"].includes(h.kind), id); if (h.kind === "wrong") assert.ok(TOKEN_EMOJI[h.pay], id); if (h.kind === "find") assert.ok(h.line, id); }
  const kinds = Object.values(HIDDEN).map((h) => h.kind); for (const k of ["find", "task", "wrong"]) assert.ok(kinds.filter((x) => x === k).length >= 3, k);
  // hidden records don't show in the record player until found
  const p = fresh(), html = recordPlayerHtml(p, { current: null, playing: false, position: { t: 0, d: 0 } }, esc, { house: "parlour" });
  for (const t of hid) assert.ok(!html.includes(`>${t.title}<`), t.id + " stays hidden");
});

test("find: poking the scene in the right order turns up the hidden record", () => {
  const has = (id) => HOUSE_TRACKS.some((t) => t.id === id); resetMusicEvents();
  const p = fresh();
  if (has("midnight-cruiser")) {
    assert.equal(musicEvent(p, "parlour", "tap", { tap: "cabinet", count: 1 }).length, 0, "not with the candle lit");
    musicEvent(p, "parlour", "tap", { tap: "bgcandle", count: 1 });
    assert.deepEqual(musicEvent(p, "parlour", "tap", { tap: "cabinet", count: 1 }).map((x) => x.t.id), ["midnight-cruiser"]);
    assert.ok(hasTrack(p, trackOf("midnight-cruiser"))); assert.equal(musicEvent(p, "parlour", "tap", { tap: "cabinet", count: 1 }).length, 0, "once only");
  }
  if (has("frets")) { assert.equal(musicEvent(p, "scriptorium", "tap", { tap: "drollery", count: 2 }).length, 0); assert.equal(musicEvent(p, "scriptorium", "tap", { tap: "drollery", count: 3 }).length, 1); }
  if (has("calm6-innocence")) { musicEvent(p, "scriptorium", "tap", { tap: "book", count: 1 }); assert.equal(musicEvent(p, "scriptorium", "tap", { tap: "page", count: 1 })[0].t.id, "calm6-innocence"); }
  if (has("champ-de-tournesol")) { musicEvent(p, "scriptorium", "tap", { tap: "snail", count: 1 }); assert.equal(musicEvent(p, "scriptorium", "tap", { tap: "worm", count: 1 })[0].t.id, "champ-de-tournesol"); }
  assert.equal(musicEvent(fresh(), "alchemist", "tap", { tap: "cabinet", count: 9 }).length, 0, "only in its own House");
});

test("task: hidden task records unlock with the other task records", () => {
  if (!HOUSE_TRACKS.some((t) => t.id === "a-cup-of-tea")) return;
  const p = fresh(); p.houses = { parlour: { rounds: 10 } }; assert.ok(!checkUnlocks(p).some((t) => t.id === "a-cup-of-tea"));
  p.readings = 3; assert.ok(checkUnlocks(p).some((t) => t.id === "a-cup-of-tea"));
});

test("crates: any House's tokens spend; paying the wrong way while holding enough of the right one finds a hidden record", () => {
  const P = HOSTS.find((h) => h.id === "parlour"), O = HOSTS.find((h) => h.id === "observatory");
  for (const h of HOSTS) assert.equal(TOKEN_EMOJI[h.id], h.token.emoji, h.id + " token emoji");
  const sale = crateOf("parlour").filter((t) => t.how === "crate"); if (!sale.length) return;
  const t = sale[0], p = fresh(), w = walletOf(p, HOSTS);
  assert.equal(buyRecord(p, t.id, "parlour", w), null, "too dear with no keys");
  addTokens(p, O, t.price); const r1 = buyRecord(p, t.id, "observatory", w); assert.ok(r1 && hasTrack(p, t)); assert.equal(r1.bonus.length, 0, "no keys held, so no hidden record");
  assert.equal(w.left("observatory"), 0); assert.equal(buyRecord(p, t.id, "observatory", w), null, "already yours");
  const u = sale[1], chilly = HOUSE_TRACKS.find((x) => x.id === "chilly-bells");
  if (u && chilly) { addTokens(p, P, u.price); addTokens(p, O, u.price); const r2 = buyRecord(p, u.id, "observatory", w); assert.deepEqual(r2.bonus.map((x) => x.id), ["chilly-bells"]); assert.equal(w.left("parlour"), u.price, "the keys weren't spent"); }
  const html = crateHtml(p, "parlour", "parlour", w, esc); assert.ok(html.includes("data-crate-pay=\"observatory\"") && html.includes("Hidden records"));
});

test("regular records: openers free on a visit, then rounds and crate turn about; Pixel Scape's on the Store's jukebox", () => {
  for (const t of HOUSE_TRACKS) {
    assert.ok(["task", "crate", "shop", "start", "hidden"].includes(t.how), t.id);
    if (t.how === "crate") assert.ok(t.price > 0 && TOKEN_EMOJI[t.house], t.id);
    if (t.how === "task") assert.ok(t.task && typeof t.test === "function", t.id);
    if (t.house === "pixelscape") assert.ok(["shop", "start"].includes(t.how), t.id);
  }
  const p = fresh(); p.houses = { observatory: { day: "2026-11-28" } }; checkUnlocks(p);
  if (OPENER.observatory) assert.ok(hasTrack(p, trackOf(OPENER.observatory)), "the Observatory opener is yours on a visit");
});

test("every CC-BY or credit-asking record shows its credit, and the record player lists all credits", () => {
  for (const r of RECORDS.filter((x) => /CC-BY/i.test(x.licence))) assert.ok(r.credit.length > 5, r.id + " needs a credit");
  const html = recordPlayerHtml(fresh(), { current: null, playing: false, position: { t: 0, d: 0 } }, esc, {});
  assert.ok(html.includes("Music credits")); for (const t of ALL_TRACKS.filter((x) => x.credit && !x.hidden)) assert.ok(html.includes(t.credit.replace(/&/g, "&")), t.id);
  assert.ok(Object.keys(HOUSE_NAMES).length === 6);
});
