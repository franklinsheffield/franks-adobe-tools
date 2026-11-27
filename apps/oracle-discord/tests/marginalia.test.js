// Scriptorium menu background + Marginalia (activity/src/scriptorium/marginalia.js), per the hosts/secrets.js contract.
import test from "node:test";
import assert from "node:assert/strict";
import { menuBg, secrets, MARGINALIA, officeOf, _reset } from "../activity/src/scriptorium/marginalia.js";

test("menu background: day and night render, hot spots tagged, reduced motion honoured", () => {
  const day = menuBg.html(new Date(2026, 10, 27, 11).getTime()), nite = menuBg.html(new Date(2026, 10, 27, 23).getTime());
  for (const h of [day, nite]) { assert.match(h, /aria-hidden="true"/); assert.doesNotMatch(h, /undefined|NaN/); }
  assert.match(nite, /scr-star/); assert.doesNotMatch(day, /scr-star/); assert.match(day, /scr-mote/);
  const taps = new Set([...day.matchAll(/class="mb-hot" data-tap="(\w+)"/g)].map((m) => m[1]));
  for (const t of ["cat", "quill", "inkwell", "book", "page", "bell", "candle", "mouse", "snail"]) assert.ok(taps.has(t), t);
  assert.match(menuBg.css, /prefers-reduced-motion/); assert.match(menuBg.css, /\.mb-hot\{pointer-events:auto/);
  assert.equal(officeOf(0), "Matins"); assert.equal(officeOf(22), "Compline");
});

test("20 marginalia, each findable, each with a real-fact line", () => {
  assert.equal(MARGINALIA.length, 20); assert.equal(secrets.items.length, 20); assert.equal(new Set(MARGINALIA.map((m) => m.id)).size, 20);
  for (const m of MARGINALIA) { assert.ok(m.line.length > 50 && m.hint && m.e && m.pay.token > 0, m.id); assert.ok(!("line" in secrets.items.find((i) => i.id === m.id))); }
  _reset(); const got = []; const api = { find: (id, line) => { if (!got.includes(id)) got.push(id); assert.ok(line); } };
  const tap = (t, n = 1) => { for (let c = 1; c <= n; c++) secrets.event("tap", { tap: t, count: c }, api); };
  tap("cat", 3); tap("page"); tap("snail"); tap("mouse", 2); tap("quill", 5); tap("inkwell"); tap("book", 3); tap("page", 6);
  for (const t of ["frame", "shells", "bell", "worm", "drollery", "hand"]) tap(t); tap("candle", 7);
  secrets.event("home", { at: new Date(2026, 10, 27, 18).getTime() }, api);
  for (let i = 0; i < 5; i++) secrets.event("poke", {}, api);
  secrets.event("result", { room: "inscriptions", won: true, perfect: true }, api);
  assert.deepEqual([...got].sort(), MARGINALIA.map((m) => m.id).sort());
});
