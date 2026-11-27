// Character options (activity/src/character.js): creator, familiars, emotes, seasonal looks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CREATOR, lookOf, withCreator, PUPILS, FAMILIARS, familiarSvg, familiarShop, EMOTES, SEASONS, seasonNow, seasonOpens, SEASONAL, onSale } from "../activity/src/character.js";
import { AVATAR_LOOK } from "../activity/src/looks.js";
import { goodsOf, STORE } from "../activity/src/store.js";
import { priceNow, featured, boxPool } from "../activity/src/featured.js";
import { MOODS } from "../activity/src/mood.js";

test("the creator keeps only known choices and recolours the avatar's eye, pupil, nails and hands", () => {
  assert.deepEqual(lookOf({ look: { iris: "#66E0C8", pupil: "nope", trim: "javascript:" } }), { iris: "#66E0C8", pupil: "", trim: "", nail: "", skin: "" });
  const A = AVATAR_LOOK.classic, B = withCreator(A, { iris: "#66E0C8", pupil: "star", nail: "#ffffff", skin: "", trim: "" });
  assert.equal(B.iris[1], "#66E0C8"); assert.equal(B.star, true); assert.equal(B.hands.nail, "#ffffff"); assert.equal(B.hands.skin, A.hands.skin); assert.equal(A.hands.nail, AVATAR_LOOK.classic.hands.nail, "the avatar itself is not changed");
  for (const c of Object.values(CREATOR)) assert.equal(c.opts[0][0], "", "first option is Auto");
  for (const k of CREATOR.pupil.opts.slice(1).map(([v]) => v)) assert.ok(PUPILS[k], k);
});

test("familiars: a free 'none', every other one draws, and all sit on their own shelf", () => {
  assert.equal(FAMILIARS[0].price, 0); assert.equal(familiarShop.items.length, FAMILIARS.length);
  for (const f of FAMILIARS.slice(1)) assert.match(familiarSvg(f.id), /^<svg[\s\S]*fm-body[\s\S]*<\/svg>$/, f.id);
});

test("emotes use real moods; seasons open and close by date; seasonal items sell only in season", () => {
  for (const e of EMOTES) assert.ok(MOODS[e.mood], e.id);
  assert.equal(seasonNow(new Date(2026, 9, 31).getTime()).id, "halloween"); assert.equal(seasonNow(new Date(2026, 11, 25).getTime()).id, "winter");
  assert.equal(seasonNow(new Date(2027, 0, 10).getTime()).id, "winter"); assert.equal(seasonNow(new Date(2027, 3, 1).getTime()).id, "spring"); assert.equal(seasonNow(new Date(2027, 6, 1).getTime()), null);
  assert.ok(seasonOpens("halloween", new Date(2026, 10, 27).getTime()) > new Date(2027, 8, 30).getTime());
  for (const se of SEASONS) assert.ok(SEASONAL.some((x) => x.season === se.id), se.id);
  const xmas = new Date(2026, 11, 25).getTime(), frost = SEASONAL.find((x) => x.season === "winter"), pumpkin = SEASONAL.find((x) => x.season === "halloween");
  assert.ok(onSale(frost, xmas) && !onSale(pumpkin, xmas)); assert.equal(priceNow(frost.id, xmas), frost.price); assert.equal(priceNow(pumpkin.id, xmas), null);
  assert.ok(STORE.some((x) => x.id === frost.id)); assert.ok(!goodsOf("outfit").some((x) => x.season), "seasonal looks stay off normal shelves");
  assert.ok(!featured(xmas).some((x) => x.season) && !Object.values(boxPool()).flat().some((x) => x.season));
});
