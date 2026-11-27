// Pull-in features (activity/src/pullin.js): daily gift ladder, weekend events, profile card, invite reward.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LADDER, giftState, claimGift, EVENTS, eventNow, nextEvent, boost, profileOf, profileHtml, inviteSent, INVITE_REWARD } from "../activity/src/pullin.js";

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
test("the gift ladder climbs on consecutive days, once a day, and resets after a missed day", () => {
  const p = { essence: 0 }; let t = at(2026, 11, 23); // a Monday: no weekend event
  assert.equal(claimGift(p, t).amount, LADDER[0]); assert.equal(claimGift(p, t), null, "once a day");
  for (let i = 1; i < 4; i++) { t += 864e5; assert.equal(claimGift(p, t).step, i); }
  assert.equal(p.essence, LADDER[0] + LADDER[1] + LADDER[2] + LADDER[3]);
  t += 2 * 864e5; assert.equal(giftState(p, t).step, 0, "missed a day");
  assert.equal(LADDER.length, 7);
});
test("weekend events: Friday to Sunday only, the same event all weekend, rotating weekly", () => {
  assert.equal(eventNow(at(2026, 11, 26)), null); // Thursday
  const fri = eventNow(at(2026, 11, 27)), sat = eventNow(at(2026, 11, 28)), sun = eventNow(at(2026, 11, 29));
  assert.ok(fri && fri === sat && sat === sun);
  assert.notEqual(eventNow(at(2026, 12, 4)), fri, "next weekend differs");
  assert.ok(nextEvent(at(2026, 11, 24)).ev); assert.equal(EVENTS.length, 4);
});
test("event bonuses apply only to their games, and the gift doubles on the Gilded weekend", () => {
  let wk = 0; while (eventNow(at(2026, 11, 27) + wk * 7 * 864e5).id !== "spirits") wk++;
  const t = at(2026, 11, 27) + wk * 7 * 864e5;
  assert.deepEqual(boost("seance", 10, 10, t), { xp: 10, es: 20 }); assert.deepEqual(boost("duel", 10, 10, t), { xp: 10, es: 10 });
  assert.deepEqual(boost("duel", 10, 10, at(2026, 11, 25)), { xp: 10, es: 10 }, "weekday");
  let g = 0; while (eventNow(at(2026, 11, 27) + g * 7 * 864e5).id !== "gilded") g++;
  assert.equal(claimGift({}, at(2026, 11, 27) + g * 7 * 864e5).amount, LADDER[0] * 2);
});
test("the profile card shows the member's own numbers, escaped", () => {
  const p = { xp: 120, readings: 9, best: 4, codex: { tarot: [1, 2, 3], iching: [1] }, gs: ["ink", "cipher"], owned: ["a"] };
  const x = profileOf(p, { name: "Ann <3", records: 5, systems: { tarot: "Tarot" } });
  assert.equal(x.codex, 4); assert.equal(x.fav, "Tarot"); assert.equal(x.secrets, 2);
  const h = profileHtml(x, esc); assert.match(h, /Ann &lt;3/); assert.ok(!/undefined|NaN/.test(h));
});
test("the invite reward is paid once", () => { const p = {}; assert.equal(inviteSent(p), INVITE_REWARD); assert.equal(inviteSent(p), 0); assert.equal(p.essence, INVITE_REWARD); });
